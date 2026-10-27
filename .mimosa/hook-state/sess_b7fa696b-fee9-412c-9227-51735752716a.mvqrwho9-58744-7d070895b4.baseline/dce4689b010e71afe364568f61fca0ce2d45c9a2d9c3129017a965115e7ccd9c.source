/**
 * Return an array of arrays of size *returnSize.
 * The sizes of the arrays are returned as *returnColumnSizes array.
 * Note: Both returned array and *columnSizes array must be malloced, assume caller calls free().
 */
int cmp(const void *a, const void *b) {
    int *pa = *(int **)a;
    int *pb = *(int **)b;
    return pa[2] - pb[2];   // 按颜色升序
}

int** colorGrid(int n, int m, int** sources, int sourcesSize, int* sourcesColSize, int* returnSize, int** returnColumnSizes) {
    // 分配并初始化返回网格
    int** col = (int**)malloc(n * sizeof(int*));
    for (int i = 0; i < n; i++) {
        col[i] = (int*)malloc(m * sizeof(int));
        for (int j = 0; j < m; j++) {
            col[i][j] = 0;
        }
    }

    *returnSize = n;
    *returnColumnSizes = (int*)malloc(n * sizeof(int));
    for (int i = 0; i < n; i++) (*returnColumnSizes)[i] = m;

    // 按颜色升序排序（小颜色在前，大颜色在后）
    qsort(sources, sourcesSize, sizeof(int*), cmp);

    // 先将所有源点颜色写入网格（后写的会覆盖先写的，即大颜色保留）
    for (int i = 0; i < sourcesSize; i++) {
        int r = sources[i][0];
        int c = sources[i][1];
        int color = sources[i][2];
        col[r][c] = color;
    }

    // 分配队列（最多入队 m*n 个元素，索引 0 ~ m*n-1）
    int** que = (int**)malloc(m * n * sizeof(int*));
    for (int i = 0; i < m * n; i++) {
        que[i] = (int*)malloc(3 * sizeof(int));
    }

    int cnt = 0, total = sourcesSize;
    // 源点倒序入队（颜色大的先入队，保证大颜色优先扩散）
    for (cnt = 0; cnt < sourcesSize; cnt++) {
        int idx = sourcesSize - 1 - cnt;
        que[cnt][0] = sources[idx][0];
        que[cnt][1] = sources[idx][1];
        que[cnt][2] = sources[idx][2];
    }

    // 多源 BFS
    for (cnt = 0; cnt < n * m; cnt++) {
        if (cnt >= total) break;   // 队列已空，停止处理

        int r = que[cnt][0];
        int c = que[cnt][1];
        int color = que[cnt][2];

        // 若该单元格尚未最终着色（值为 -1 或 0），赋予颜色
        if (col[r][c] == -1 || col[r][c] == 0) {
            col[r][c] = color;
        }

        // 向四个方向扩散
        // 上
        if (r - 1 >= 0 && col[r - 1][c] == 0) {
            col[r - 1][c] = -1;                 // 标记为“已入队待着色”
            que[total][0] = r - 1;
            que[total][1] = c;
            que[total][2] = color;
            if (total < m * n) total++;         // 防止越界（但实际 total 不会超过 m*n）
        }
        // 下
        if (r + 1 < n && col[r + 1][c] == 0) {
            col[r + 1][c] = -1;
            que[total][0] = r + 1;
            que[total][1] = c;
            que[total][2] = color;
            if (total < m * n) total++;
        }
        // 左
        if (c - 1 >= 0 && col[r][c - 1] == 0) {
            col[r][c - 1] = -1;
            que[total][0] = r;
            que[total][1] = c - 1;
            que[total][2] = color;
            if (total < m * n) total++;
        }
        // 右
        if (c + 1 < m && col[r][c + 1] == 0) {
            col[r][c + 1] = -1;
            que[total][0] = r;
            que[total][1] = c + 1;
            que[total][2] = color;
            if (total < m * n) total++;
        }
    }

    // 释放队列内存
    for (int i = 0; i < m * n; i++) free(que[i]);
    free(que);

    return col;
}
