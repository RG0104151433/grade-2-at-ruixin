int maxPointsInsideSquare(int** points, int pointsSize, int* pointsColSize, char* s) {
    //构建val数组，用于记录每个位置点需要多大的正方形才会被覆盖
    int* val=malloc(sizeof(int)*pointsSize);
    for (int i=0;i<pointsSize;i++) {
        val[i]=-1;
        val[i]=abs(points[i][0])<abs(points[i][1])?abs(points[i][1]):abs(points[i][0]);
    }
    //构建alp数组，其[0]记录最近位置的val值，[1]记录第二近的一个
    int alp[26][2]={0};
    for (int i=0;i<pointsSize;i++) {
        int t = s[i] - 'a';
        int v = val[i];
        if (alp[t][0] == 0) {
            alp[t][0] = v;
        } else if (v < alp[t][0]) {
            alp[t][1] = alp[t][0];
            alp[t][0] = v;
        } else if (alp[t][1] == 0 || v < alp[t][1]) {
            alp[t][1] = v;
        }
    }
    //用size求出的是最大正方形半边长+1
    int size=INT_MAX;
    for (int i=0;i<26;i++) {
        if (alp[i][1]!=0) size=alp[i][1]<size?alp[i][1]:size;
    }
    //最后用ans记录有多少个点符合要求
    int ans=0;
    for (int i=0;i<pointsSize;i++) {
        if (val[i]<size) ans++;
    }
    free(val);
    return size==INT_MAX?pointsSize:ans;
}
//时间复杂度O(3*n)，空间复杂度O(n)
