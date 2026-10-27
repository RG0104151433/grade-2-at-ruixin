// 说明：本文件由 `v1-原始实现.cpp` 拆出（该文件里写了 2 份实现），这是第 2 份。

int minTime(char* s, int* order, int orderSize, int k) {
    long long total = (long long) orderSize * (orderSize + 1) / 2;  // 所有子串数量
    if (total < k) return -1;  // 如果所有子串数量尚且不足k，则必然错误
    int left = 0, right = orderSize - 1;
    while (left < right) {
        int mid = left + (right - left) / 2;
        // 动态生成第mid步的状态
        char* current = (char*)malloc((orderSize + 1) * sizeof(char));
        if (!current) return -1;  // 内存分配失败
        // 从原始字符串开始
        strncpy(current, s, orderSize);
        current[orderSize] = '\0';
        // 应用前mid+1步操作（因为mid是从0开始计数的，所以是0到mid）
        for (int i = 0; i <= mid; i++) {
            current[order[i]] = '*';
        }
        // 计算有效子串数
       long long result = total, count = 0;
        for (int i = 0; i < orderSize; i++) {
            if (current[i] != '*') {
                count++;
            }
            if (current[i] == '*' || i == orderSize - 1) {
                result -= (long long) count * (count + 1) / 2;
                count = 0;
            }
        }
        // 释放当前状态的内存
        free(current);
        if (result >= k) {
            right = mid;  // 结果多，说明切分过细，需要减少
        } else {
            left = mid + 1;  // 数量小于等于，说明切分不足，需要增加
        }
    }
    return left;
}
