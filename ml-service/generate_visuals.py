import matplotlib.pyplot as plt
import pandas as pd
import numpy as np

def create_styled_table(data, title, filename, highlight_last=False):
    fig, ax = plt.subplots(figsize=(10, 4))
    ax.axis('off')
    
    # Create the table
    table = ax.table(cellText=data.values, colLabels=data.columns, cellLoc='center', loc='center')
    
    # Styling
    table.auto_set_font_size(False)
    table.set_fontsize(11)
    table.scale(1.2, 2)
    
    # Header styling
    for (row, col), cell in table.get_celld().items():
        if row == 0:
            cell.set_text_props(weight='bold', color='white')
            cell.set_facecolor('#2c3e50')
        elif highlight_last and row == len(data):
            cell.set_text_props(weight='bold', color='#1e8449')
            cell.set_facecolor('#e9f7ef')
        else:
            cell.set_facecolor('#fdfefe')

    plt.title(title, fontsize=14, pad=20, weight='bold')
    plt.tight_layout()
    plt.savefig(filename, dpi=300, bbox_inches='tight')
    print(f"Saved: {filename}")
    plt.close()

def create_accuracy_chart():
    models = ['Logistic Reg', 'Decision Tree', 'SVM', 'KNN', 'Random Forest', 'Hybrid (Ours)']
    accuracies = [76.2, 83.6, 88.3, 85.4, 91.7, 97.73]
    colors = ['#bdc3c7', '#bdc3c7', '#bdc3c7', '#bdc3c7', '#bdc3c7', '#27ae60']

    plt.figure(figsize=(10, 6))
    bars = plt.bar(models, accuracies, color=colors, alpha=0.8)
    
    # Add values on top of bars
    for bar in bars:
        yval = bar.get_height()
        plt.text(bar.get_x() + bar.get_width()/2, yval + 1, f'{yval}%', ha='center', va='bottom', weight='bold')

    plt.ylim(0, 110)
    plt.ylabel('Accuracy (%)', weight='bold')
    plt.title('Algorithm Accuracy Comparison', fontsize=14, weight='bold', pad=15)
    plt.grid(axis='y', linestyle='--', alpha=0.3)
    
    # Highlighting our model
    plt.savefig('accuracy_comparison_chart.png', dpi=300, bbox_inches='tight')
    print("Saved: accuracy_comparison_chart.png")
    plt.close()

# 1. Detailed Metrics Table Data
detailed_data = pd.DataFrame({
    'Metric': ['Accuracy', 'Precision', 'Recall', 'F1-Score'],
    'Ensemble Hybrid Model': ['97.73%', '0.9787', '0.9773', '0.9772']
})

# 2. Comparison Table Data
comparison_data = pd.DataFrame({
    'Algorithm': ['Logistic Regression', 'Decision Tree', 'SVM (RBF kernel)', 'KNN (k=5)', 'Random Forest', 'Ensemble Hybrid Model'],
    'Accuracy': ['76.20%', '83.60%', '88.30%', '85.40%', '91.70%', '97.73%'],
    'Precision': ['0.74', '0.82', '0.87', '0.84', '0.91', '0.98'],
    'Recall': ['0.72', '0.81', '0.86', '0.83', '0.91', '0.98'],
    'F1-Score': ['0.73', '0.82', '0.86', '0.83', '0.90', '0.98']
})

if __name__ == '__main__':
    create_styled_table(detailed_data, "Detailed Performance of Ensemble Hybrid Model", "detailed_metrics_table.png")
    create_styled_table(comparison_data, "Algorithm Comparison Table", "comparison_analysis_table.png", highlight_last=True)
    create_accuracy_chart()
