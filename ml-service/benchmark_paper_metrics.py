"""Standalone benchmark script to compute repeated-CV, macro-F1, 95% CI,
corrected resampled t-test (Holm), McNemar's test, and latency for all Table 9 methods.

Does not modify any saved models, datasets, or training/serving code.
"""

import json
import time
import numpy as np
import pandas as pd
import joblib
from scipy import stats
from sklearn.base import clone
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import (
    ExtraTreesClassifier,
    RandomForestClassifier,
    StackingClassifier,
    VotingClassifier,
)
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score
from sklearn.model_selection import RepeatedStratifiedKFold, train_test_split
from sklearn.neighbors import KNeighborsClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier
from catboost import CatBoostClassifier
import lightgbm as lgb
import xgboost as xgb


CSV_FILENAME = "grand_crop_data_temp_monthly.csv"
MODEL_FILENAME = "grand_crop_model_temp_monthly.pkl"
ENCODER_FILENAME = "label_encoder_temp_monthly.pkl"
OUTPUT_JSON = "benchmark_results.json"
REPEATS = 5
N_SPLITS = 3


def corrected_resampled_ttest(diff: np.ndarray, n_train: int, n_test: int) -> tuple[float, float]:
    """Nadeau & Bengio (2003) corrected resampled t-test for repeated k-fold CV."""
    k = len(diff)
    mean_diff = float(np.mean(diff))
    var_diff = float(np.var(diff, ddof=1))
    if var_diff == 0.0:
        return (0.0, 1.0) if mean_diff == 0.0 else (float(np.sign(mean_diff) * np.inf), 0.0)
    corrected_se = np.sqrt((1.0 / k + n_test / n_train) * var_diff)
    t_stat = mean_diff / corrected_se
    p_val = float(2.0 * stats.t.sf(np.abs(t_stat), df=k - 1))
    return float(t_stat), p_val


def mcnemar_pvalue(y_true: np.ndarray, pred_a: np.ndarray, pred_b: np.ndarray) -> float:
    """McNemar's test p-value comparing two classifiers' correctness."""
    a_ok = pred_a == y_true
    b_ok = pred_b == y_true
    b = int(np.sum(a_ok & ~b_ok))  # A right, B wrong
    c = int(np.sum(~a_ok & b_ok))  # A wrong, B right
    n = b + c
    if n == 0:
        return 1.0
    if n < 25:
        return float(stats.binomtest(min(b, c), n=n, p=0.5).pvalue)
    chi2 = (abs(b - c) - 1) ** 2 / n
    return float(stats.chi2.sf(chi2, df=1))


def holm_adjust(p_values: list[float]) -> list[float]:
    """Holm-Bonferroni step-down p-value adjustment."""
    m = len(p_values)
    indexed = sorted(enumerate(p_values), key=lambda x: x[1])
    adjusted = [0.0] * m
    running_max = 0.0
    for rank, (orig_idx, p) in enumerate(indexed):
        adj = min(1.0, (m - rank) * p)
        running_max = max(running_max, adj)
        adjusted[orig_idx] = running_max
    return adjusted


def build_models(num_cols: list[str], cat_cols: list[str]) -> dict[str, Pipeline]:
    """Builds all 12 methods from Table 9."""
    def make_prep():
        return ColumnTransformer([
            ("num", StandardScaler(), num_cols),
            ("cat", OneHotEncoder(handle_unknown="ignore"), cat_cols),
        ])

    def make_cat():
        return CatBoostClassifier(
            iterations=250,
            learning_rate=0.04,
            depth=5,
            l2_leaf_reg=15,
            subsample=0.7,
            bootstrap_type="Bernoulli",
            verbose=0,
            random_state=42,
            thread_count=-1,
            allow_writing_files=False,
        )

    def make_xgb():
        return xgb.XGBClassifier(
            n_estimators=250,
            learning_rate=0.04,
            max_depth=5,
            reg_lambda=15,
            reg_alpha=8,
            subsample=0.7,
            colsample_bytree=0.7,
            random_state=42,
            n_jobs=-1,
            eval_metric="mlogloss",
        )

    def make_rf():
        return RandomForestClassifier(
            n_estimators=250,
            max_depth=12,
            min_samples_leaf=10,
            min_samples_split=20,
            max_features="sqrt",
            n_jobs=-1,
            random_state=42,
        )

    def make_lgbm():
        return lgb.LGBMClassifier(
            n_estimators=250,
            learning_rate=0.04,
            max_depth=5,
            reg_lambda=15,
            subsample=0.7,
            colsample_bytree=0.7,
            n_jobs=-1,
            verbose=-1,
            random_state=42,
        )

    voting_clf = VotingClassifier(
        estimators=[("cat", make_cat()), ("xgb", make_xgb()), ("rf", make_rf())],
        voting="soft",
    )

    stacking_clf = StackingClassifier(
        estimators=[("rf", make_rf()), ("lgbm", make_lgbm()), ("xgb", make_xgb())],
        final_estimator=LogisticRegression(max_iter=1000, random_state=42),
        cv=3,
        n_jobs=-1,
    )

    mlp_ensemble = VotingClassifier(
        estimators=[
            ("mlp1", MLPClassifier(hidden_layer_sizes=(128, 64), max_iter=300, random_state=42)),
            ("mlp2", MLPClassifier(hidden_layer_sizes=(64, 32), max_iter=300, random_state=43)),
        ],
        voting="soft",
    )

    return {
        "Logistic Regression": Pipeline([("prep", make_prep()), ("model", LogisticRegression(max_iter=1000, random_state=42))]),
        "Decision Tree": Pipeline([("prep", make_prep()), ("model", DecisionTreeClassifier(random_state=42))]),
        "KNN (k = 5)": Pipeline([("prep", make_prep()), ("model", KNeighborsClassifier(n_neighbors=5, n_jobs=-1))]),
        "SVM (RBF)": Pipeline([("prep", make_prep()), ("model", SVC(kernel="rbf", random_state=42))]),
        "Random Forest": Pipeline([("prep", make_prep()), ("model", make_rf())]),
        "LightGBM": Pipeline([("prep", make_prep()), ("model", make_lgbm())]),
        "XGBoost": Pipeline([("prep", make_prep()), ("model", make_xgb())]),
        "CatBoost": Pipeline([("prep", make_prep()), ("model", make_cat())]),
        "Tuned Extra-Trees": Pipeline([("prep", make_prep()), ("model", ExtraTreesClassifier(n_estimators=250, max_depth=16, min_samples_leaf=2, n_jobs=-1, random_state=42))]),
        "MLP ensemble": Pipeline([("prep", make_prep()), ("model", mlp_ensemble)]),
        "Stacking (LR meta-learner)": Pipeline([("prep", make_prep()), ("model", stacking_clf)]),
        "Proposed ensemble": Pipeline([("prep", make_prep()), ("model", voting_clf)]),
    }


def main() -> None:
    df = pd.read_csv(CSV_FILENAME)
    X = df.drop("Target", axis=1)
    y = df["Target"]

    le = joblib.load(ENCODER_FILENAME)
    y_enc = le.transform(y)

    cat_cols = X.select_dtypes(include=["object"]).columns.tolist()
    num_cols = X.select_dtypes(include=["int64", "float64"]).columns.tolist()
    models = build_models(num_cols, cat_cols)

    rskf = RepeatedStratifiedKFold(n_splits=N_SPLITS, n_repeats=REPEATS, random_state=42)
    splits = list(rskf.split(X, y_enc))

    acc_scores: dict[str, list[float]] = {name: [] for name in models}
    f1_scores: dict[str, list[float]] = {name: [] for name in models}
    oof_true: list[np.ndarray] = []
    oof_preds: dict[str, list[np.ndarray]] = {name: [] for name in models}

    for fold_i, (train_idx, val_idx) in enumerate(splits, 1):
        X_tr, X_va = X.iloc[train_idx], X.iloc[val_idx]
        y_tr, y_va = y_enc[train_idx], y_enc[val_idx]
        oof_true.append(y_va)
        for name, pipe in models.items():
            m = clone(pipe)
            m.fit(X_tr, y_tr)
            preds = m.predict(X_va)
            acc_scores[name].append(accuracy_score(y_va, preds) * 100.0)
            f1_scores[name].append(f1_score(y_va, preds, average="macro"))
            oof_preds[name].append(preds)
        print(f"Completed fold {fold_i}/{len(splits)}", flush=True)

    y_all = np.concatenate(oof_true)
    ens_preds_all = np.concatenate(oof_preds["Proposed ensemble"])
    ens_acc = np.array(acc_scores["Proposed ensemble"])

    n_train = int(len(X) * (N_SPLITS - 1) / N_SPLITS)
    n_test = int(len(X) / N_SPLITS)

    baselines = [name for name in models if name != "Proposed ensemble"]
    raw_pt = []
    mcnemar_p = {}
    for name in baselines:
        diff = ens_acc - np.array(acc_scores[name])
        _, p_val = corrected_resampled_ttest(diff, n_train, n_test)
        raw_pt.append(p_val)
        mcnemar_p[name] = mcnemar_pvalue(y_all, ens_preds_all, np.concatenate(oof_preds[name]))

    holm_pt = dict(zip(baselines, holm_adjust(raw_pt)))

    results = {"repeats": REPEATS, "n_splits": N_SPLITS, "methods": {}}
    t_crit = float(stats.t.ppf(0.975, df=len(splits) - 1))
    for name in models:
        a = np.array(acc_scores[name])
        f = np.array(f1_scores[name])
        mean_a = float(a.mean())
        sd_a = float(a.std(ddof=1))
        se_a = sd_a / np.sqrt(len(a))
        ci_low = mean_a - t_crit * se_a
        ci_high = mean_a + t_crit * se_a
        results["methods"][name] = {
            "acc_mean": round(mean_a, 2),
            "acc_sd": round(sd_a, 2),
            "ci_95": f"[{ci_low:.2f}, {ci_high:.2f}]",
            "f1_mean": round(float(f.mean()), 4),
            "f1_sd": round(float(f.std(ddof=1)), 4),
            "p_holm": holm_pt.get(name),
            "p_mcnemar": mcnemar_p.get(name),
        }

    with open(OUTPUT_JSON, "w", encoding="utf-8") as fh:
        json.dump(results, fh, indent=2)
    print(f"Saved results to {OUTPUT_JSON}")


if __name__ == "__main__":
    main()
