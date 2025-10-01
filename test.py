import numpy as np

I = np.array([
    [34,56,234,24,129],
    [123,32,254,12,243],
    [93,55,33,34,2],
    [170,156,220,234,8],
    [5,253,0,12,111]
], dtype=float)

def mean_filter_3x3(img):
    pad = 1
    p = np.pad(img, ((pad,pad),(pad,pad)), mode='constant', constant_values=0)
    out = np.zeros_like(img)
    for i in range(img.shape[0]):
        for j in range(img.shape[1]):
            out[i,j] = p[i:i+3, j:j+3].mean()
    return out

AV = mean_filter_3x3(I)
diff = np.abs(I - AV)
T = 80

result = I.copy()
mask = diff >= T
result[mask] = np.round(AV[mask])

print("AV =\n", AV)
print("\n|I-AV| =\n", diff)
print("\nKết quả sau thay thế (round AV khi diff>=3):\n", result.astype(int))
