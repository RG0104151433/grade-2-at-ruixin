int cmp(const void* a, const void* b) { 
    int end_a = (*(int**)a)[1], end_b = (*(int**)b)[1];
    return (end_a > end_b) - (end_a < end_b);
}//按照右端点的位置排序
int findMinArrowShots(int** points, int pointsSize, int* pointsColSize) {
    qsort(points, pointsSize, sizeof(int*), cmp); // 根据区间右端值排序
    int ans = 1;
    int pre = points[0][1];
    for (int i = 1; i < pointsSize; i++) {
        if (points[i][0] > pre) { // 上一个放的点在区间左边
            ans++;
            pre = points[i][1]; // 在区间的最右边放一个点
        }
    }
    return ans;
}
