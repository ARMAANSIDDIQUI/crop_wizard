"""Generates final_paper_texts.docx with all 9 screenshot texts in numeric serial."""

import json
from docx import Document
from docx.shared import Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH


def format_p(p: float | None) -> str:
    if p is None:
        return "—"
    if p < 1e-4:
        return "< 0.0001"
    return f"{p:.4f}"


def add_table_from_rows(doc: Document, headers: list[str], rows: list[list[str]]) -> None:
    table = doc.add_table(rows=1 + len(rows), cols=len(headers))
    table.style = "Table Grid"
    for j, h in enumerate(headers):
        cell = table.rows[0].cells[j]
        cell.text = h
        for run in cell.paragraphs[0].runs:
            run.bold = True
    for i, r in enumerate(rows, start=1):
        for j, val in enumerate(r):
            table.rows[i].cells[j].text = val
    doc.add_paragraph()


def main() -> None:
    with open("benchmark_results.json", "r", encoding="utf-8") as fh:
        bench = json.load(fh)

    methods = bench["methods"]
    ens = methods["Proposed ensemble"]
    best_base_name = "CatBoost"
    best_base = methods[best_base_name]

    doc = Document()
    title = doc.add_heading("CropWizard — Completed Paper Texts (1–9)", 0)
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER

    # 1. Abstract
    doc.add_heading("1. Abstract", level=1)
    doc.add_paragraph(
        f"Abstract: Crop recommendation models are usually trained on clean benchmark data, whereas field measurements "
        f"are affected by sensor drift, calibration error and rounding. This study presents CropWizard, a web-deployed "
        f"framework built on a heterogeneous soft-voting ensemble of CatBoost, XGBoost, Random Forest, Ridge Regression "
        f"and Lasso Regression trained with controlled Gaussian noise injection (noise scale σ = [NOT IN PROJECT: repo uses "
        f"0.14 uniform multiplicative noise + N(0, 2.0) monthly temperature noise] training-standard-deviation units, "
        f"A = 80 noisy replicas, clipped to the observed feature range). The dataset comprises 1,760 records from 182 "
        f"districts of Northern India [NOTE: repo uses 14 Indian states] with 19 soil, climatic and geographic predictors "
        f"and 22 crop classes. Under 5×3-fold repeated stratified cross-validation, the ensemble achieved "
        f"{ens['acc_mean']:.2f} ± {ens['acc_sd']:.2f}% accuracy and a macro-F1 of {ens['f1_mean']:.4f} ± {ens['f1_sd']:.4f}, "
        f"compared with {best_base['acc_mean']:.2f}% for the strongest competing method, {best_base_name} "
        f"(corrected resampled t-test, Holm-adjusted p = {format_p(best_base['p_holm'])}). "
        f"The proposed soft-voting ensemble achieved the highest mean accuracy and macro-F1 across all 12 evaluated models "
        f"and significantly outperformed classical baselines (Logistic Regression, Decision Tree, KNN, SVM, Extra-Trees, "
        f"and MLP), while performing comparably to standalone CatBoost under the conservative corrected resampled t-test. "
        f"CropWizard returns a ranked list of crops with confidence scores and crop-specific advisory descriptors "
        f"(season, crop duration and water requirement) at a mean latency of 75.00 ms per request. External geographic "
        f"and temporal validation is still required before operational use."
    )

    # 2. Class Distribution & Missing Values + Table 3
    doc.add_heading("2. Class Distribution, Missing Values & Table 3", level=1)
    doc.add_paragraph(
        "The class distribution is reported in Table 3. The smallest class contains 80 records and the largest 80 records "
        "(imbalance ratio 1.00). The dataset is completely balanced across all 22 crop classes, with every class equally "
        "represented. Missing values affect 0 of the 19 predictors (0.00% of all cells) and are handled as described in Section 7."
    )
    doc.add_paragraph("Table 3. Class distribution of the dataset (raw counts)").runs[0].bold = True
    crops = [
        "apple", "banana", "blackgram", "chickpea", "coconut", "coffee", "cotton",
        "grapes", "jute", "kidneybeans", "lentil", "maize", "mango", "mothbeans",
        "mungbean", "muskmelon", "orange", "papaya", "pigeonpeas", "pomegranate",
        "rice", "watermelon",
    ]
    add_table_from_rows(
        doc,
        ["Crop Class", "Count", "Share (%)"],
        [[c, "80", "4.55%"] for c in crops] + [["Total", "1,760", "100.00%"]],
    )

    # 3. 6.2 Validation Protocol
    doc.add_heading("3. Section 6.2 — Validation Protocol", level=1)
    doc.add_paragraph(
        "Model performance was estimated with repeated stratified 3-fold cross-validation. In each of R = 5 repetitions, "
        "the dataset was shuffled with a different random seed (base seed 42) and partitioned into three folds D1, D2 and D3 "
        "with the same class proportions; each fold served once as the validation set while the other two were used for training:"
    )

    # 4. Compute Environment & Code Repository
    doc.add_heading("4. Compute Environment & Code Repository", level=1)
    doc.add_paragraph(
        "Experiments were run on Intel(R) Core(TM) i7-6600U CPU @ 2.60GHz (4 logical cores, 15.9 GB RAM, Windows 10 (10.0.19045)) "
        "without a GPU, using Python 3.13.8, scikit-learn 1.6.1, XGBoost 3.1.2, CatBoost 1.2.8 and LightGBM 4.6.0. "
        "The complete experiment code, which regenerates every table and figure in Section 11, is available at "
        "https://github.com/ARMAANSIDDIQUI/crop_wizard."
    )

    # 5. Hyperparameters & Algorithm 1
    doc.add_heading("5. Hyperparameters Summary", level=1)
    doc.add_paragraph(
        "units), A = 80, w_m = 1 and R = 5; the remaining hyperparameters are listed in Table 4."
    )

    # 6. Table 6
    doc.add_heading("6. Table 6 — Time Complexity & Measured Training Time per Fold", level=1)
    doc.add_paragraph("Table 6. Time complexity of the ensemble members and measured training time per fold").runs[0].bold = True
    add_table_from_rows(
        doc,
        ["Member", "Training time", "Inference (per sample)", "Measured training time per fold (s)"],
        [
            ["CatBoost", "O(T·D·n'·d)", "O(T·(D + K))", "18.98 (± 2.97)"],
            ["XGBoost", "O(K·T·n'·d)", "O(K·T·D)", "25.15 (± 13.77)"],
            ["Random Forest", "O(T·√d·n' log n')", "O(T·log n')", "2.44 (± 0.23)"],
            ["Ridge (one-vs-rest)", "O(n'·d² + d³ + n'·d·K)", "O(d·K)", "0.18 (± 0.03)"],
            ["Lasso (one-vs-rest)", "O(I·n'·d·K)", "O(d·K)", "1.26 (± 0.04)"],
            ["Soft voting", "—", "O(M·K), M = 5", "—"],
        ],
    )

    # 7. Backend Framework
    doc.add_heading("7. Backend Serving Pipeline", level=1)
    doc.add_paragraph(
        "inputs and sends them as a JSON request to a REST endpoint implemented in Flask 3.1.2. The server validates "
        "required fields and value ranges, applies the serialized preprocessing pipeline (imputer, encoder and scaler "
        "fitted on the full training data), queries the five serialized"
    )

    # 8. Table 7
    doc.add_heading("8. Table 7 — Deployment Profile of CropWizard", level=1)
    doc.add_paragraph("Table 7. Deployment profile of CropWizard").runs[0].bold = True
    add_table_from_rows(
        doc,
        ["Item", "Value"],
        [
            ["Serialized model size", "12.85 MB (joblib, compressed)"],
            ["Single-request latency (mean / 95th percentile)", "75.00 ms / 154.94 ms"],
            ["Throughput per worker process", "≈ 13.2 requests/s"],
            ["Final training time (full augmented data)", "38.77 s"],
            ["Hardware", "Intel(R) Core(TM) i7-6600U CPU @ 2.60GHz, 4 logical cores, 15.9 GB RAM, no GPU"],
            ["Software", "Python 3.13.8, scikit-learn 1.6.1, XGBoost 3.1.2, CatBoost 1.2.8"],
            ["Backend framework", "Flask 3.1.2"],
        ],
    )

    # 9. Table 9
    doc.add_heading("9. Table 9 — Performance of the Proposed Ensemble and Comparison Methods", level=1)
    doc.add_paragraph(
        "Table 9. Performance of the proposed ensemble and comparison methods (5×3-fold repeated stratified cross-validation, mean ± SD)"
    ).runs[0].bold = True
    t9_labels = [
        ("Logistic Regression", "Logistic Regression"),
        ("Decision Tree", "Decision Tree"),
        ("KNN (k = 5)", "KNN (k = 5)"),
        ("SVM (RBF)", "SVM (RBF)"),
        ("Random Forest", "Random Forest"),
        ("LightGBM", "LightGBM"),
        ("XGBoost", "XGBoost"),
        ("CatBoost", "CatBoost"),
        ("Tuned Extra-Trees (BO; cf. [7])", "Tuned Extra-Trees"),
        ("MLP ensemble (NI)", "MLP ensemble"),
        ("Stacking, LR meta-learner (NI; cf. [5])", "Stacking (LR meta-learner)"),
        ("Proposed ensemble (NI, soft vote)", "Proposed ensemble"),
    ]
    t9_rows = []
    for display_name, key in t9_labels:
        m = methods[key]
        t9_rows.append([
            display_name,
            f"{m['acc_mean']:.2f} ± {m['acc_sd']:.2f}",
            m["ci_95"],
            f"{m['f1_mean']:.4f} ± {m['f1_sd']:.4f}",
            format_p(m["p_holm"]),
            format_p(m["p_mcnemar"]),
        ])
    add_table_from_rows(
        doc,
        ["Method", "Accuracy (%)", "95% CI (%)", "Macro-F1", "p (corrected t, Holm)", "p (McNemar)"],
        t9_rows,
    )

    output_path = "final_paper_texts.docx"
    doc.save(output_path)
    print(f"Saved {output_path}")


if __name__ == "__main__":
    main()

