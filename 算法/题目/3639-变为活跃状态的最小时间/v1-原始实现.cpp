// 说明：本文件由 `v1-原始实现.cpp` 拆出（该文件里写了 2 份实现），这是第 1 份。

int minTime(char* s, int* order, int orderSize, int k) {
    int total=orderSize*(orderSize+1)/2;//所有子串数量
    if (total<k) return -1;//如果所有子串数量尚且不足k，则必然错误
    // 使用动态分配的二维数组进行模拟
    char** arr = (char**)malloc(orderSize * sizeof(char*));
    for (int i = 0; i < orderSize; i++) {
        arr[i] = (char*)malloc((orderSize + 1) * sizeof(char));  // +1 为字符串结束符
        if (i == 0) {
            strncpy(arr[i], s, orderSize);
            arr[i][orderSize] = '\0';  // 添加字符串结束符
            arr[i][order[i]] = '*';
        } else {
            strncpy(arr[i], arr[i-1], orderSize);
            arr[i][orderSize] = '\0';  // 添加字符串结束符
            arr[i][order[i]] = '*';
        }
    }//通过O(n)操作，递推模拟所有操作
    int left=0,right=orderSize-1;
    while (left<right) {
        int mid=left+(right-left)/2;
        int result=total,count=0;//使用count计算已有的连续字母数量
        for (int i=0;i<orderSize;i++) {
            if (arr[mid][i]!='*') count++;
            if (arr[mid][i]=='*' || i==orderSize-1) {
                result-=count*(count+1)/2;//通过不断减去不含*的子串数量，反向得到每一个的结果
                count=0;
            }
        }
        if (result>=k) right=mid;//结果多，说明切分过细，需要减少
        else left=mid+1;//数量小于等于，说明切分不足，需要增加
    }// 释放动态分配的内存
    for (int i = 0; i < orderSize; i++) {
        free(arr[i]);
    }
    free(arr);
    return left;
}
