//以数组 intervals 表示若干个区间的集合，其中单个区间为 intervals[i] = [starti, endi] 。请你合并所有重叠的区间，并返回 一个不重叠的区间数组，该数组需恰好覆盖输入中的所有区间 。
//思路为先左端点排序
// 比较函数：按区间左端点升序排序
int cmp(const void* a, const void* b) {
    int* intervalA = *(int**)a;
    int* intervalB = *(int**)b;
    // 题目数据通常不会溢出，直接相减即可
    return intervalA[0] - intervalB[0];
}

int** merge(int** intervals, int intervalsSize, int* intervalsColSize, 
            int* returnSize, int** returnColumnSizes) {
    // 处理空输入
    if (intervalsSize == 0) {
        *returnSize = 0;
        *returnColumnSizes = NULL;
        return NULL;
    }

    // 1. 按照左端点排序
    qsort(intervals, intervalsSize, sizeof(int*), cmp);

    // 2. 准备答案容器（最多 intervalsSize 个区间）
    int** ans = (int**)malloc(intervalsSize * sizeof(int*));
    int* colSizes = (int*)malloc(intervalsSize * sizeof(int));
    int count = 0; // 当前已合并的区间个数

    // 3. 遍历排序后的区间
    for (int i = 0; i < intervalsSize; ++i) {
        int left = intervals[i][0];
        int right = intervals[i][1];

        // 如果当前答案为空白，或者当前区间无法与上一个合并
        if (count == 0 || left > ans[count - 1][1]) {
            // 开辟新区间，并拷贝数据
            ans[count] = (int*)malloc(2 * sizeof(int));
            ans[count][0] = left;
            ans[count][1] = right;
            colSizes[count] = 2;   // 每个区间固定为 2 列
            ++count;
        } else {
            // 可以合并，更新右端点最大值
            if (right > ans[count - 1][1]) {
                ans[count - 1][1] = right;
            }
            // 合并时不增加 count，列宽不变
        }
    }

    // 4. 设置输出参数
    *returnSize = count;
    *returnColumnSizes = colSizes; // 多分配的空间无需回收，调用者只会读取前 count 个
    return ans;
}
