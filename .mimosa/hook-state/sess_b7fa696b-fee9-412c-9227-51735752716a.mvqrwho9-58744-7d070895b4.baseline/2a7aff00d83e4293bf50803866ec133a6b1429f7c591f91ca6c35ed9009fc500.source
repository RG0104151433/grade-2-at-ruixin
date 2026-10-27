int** rangeAddQueries(int n, int** queries, int queriesSize, int* queriesColSize, int* returnSize, int** returnColumnSizes) {// 二维差分
    int** diff = calloc(n + 2, sizeof(int*));
    for (int i = 0; i < n + 2; i++) diff[i] = calloc(n + 2, sizeof(int));
    for (int i = 0; i < queriesSize; i++) {
        int r1 = queries[i][0], c1 = queries[i][1], r2 = queries[i][2], c2 = queries[i][3];
        diff[r1 + 1][c1 + 1]++;
        diff[r1 + 1][c2 + 2]--;
        diff[r2 + 2][c1 + 1]--;
        diff[r2 + 2][c2 + 2]++;
    }
    int** ans = malloc(n * sizeof(int*));// 原地计算 diff 的二维前缀和，然后填入答案
    *returnSize = n;
    *returnColumnSizes = malloc(n * sizeof(int));
    for (int i = 0; i < n; i++) {
        ans[i] = malloc(n * sizeof(int));
        (*returnColumnSizes)[i] = n;
    }
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            diff[i + 1][j + 1] += diff[i + 1][j] + diff[i][j + 1] - diff[i][j];
            ans[i][j] = diff[i + 1][j + 1];
        }
    }
    for (int i = 0; i < n + 2; i++) free(diff[i]);
    free(diff);
    return ans;
}
