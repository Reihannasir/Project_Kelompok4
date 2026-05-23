# Updated Dataset Balancing Method

This update introduces a more robust and representative dataset balancing strategy using **cluster-based downsampling**.

### Method:
- Each class is processed through a **ResNet50 pretrained feature extractor** on ImageNet.
- Images are converted into 2048-dimensional feature vectors.
- **MiniBatchKMeans** clustering is applied to select **1,000 representative images per class**.
- This avoids bias introduced by naive random sampling, which can preserve outliers or duplicates.

### Objective:
- Prevent overfitting on majority classes.
- Ensure the dataset is **visually balanced**, not just numerically equal.
- Improve the fairness and overall performance of CNN-based and SVM-based classification models.
