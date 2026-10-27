#define MIN(a, b) ((b) < (a) ? (b) : (a))
#define MAX(a, b) ((b) > (a) ? (b) : (a))
int countGoodTriplets(int* arr, int arrSize, int a, int b, int c) {
    int mx = 0;
    for (int i = 0; i < arrSize; i++) {
        mx = MAX(mx, arr[i]);
    }//找出数组中最大值
    int* s = calloc(mx + 2, sizeof(int)); // cnt 数组的前缀和（值域前缀和）
    int ans = 0;
    for (int j = 0; j < arrSize; j++) {
        int y = arr[j];
        for (int k = j + 1; k < arrSize; k++) {
            int z = arr[k];
            if (abs(y - z) > b) {
                continue;
            }
            int l = MAX(MAX(y - a, z - c), 0);
            int r = MIN(MIN(y + a, z + c), mx);
            ans += MAX(s[r + 1] - s[l], 0); // 如果 l > r + 1，s[r + 1] - s[l] 可能是负数
        }
        for (int v = y + 1; v < mx + 2; v++) {
            s[v]++; // 把 y 加到 cnt 数组中，更新所有受到影响的前缀和
        }
    }
    free(s);
    return ans;
}
