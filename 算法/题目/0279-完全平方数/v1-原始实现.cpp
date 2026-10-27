int numSquares(int n) {
    int ans[n+1];
    ans[0] = 0;
    for (int i = 1; i <= n; i++) {  // 修正1：循环条件改为 i<=n
        int sqrt_i = (int)sqrt(i);
        if (sqrt_i * sqrt_i == i) {  // 修正3：避免浮点数精度问题
            ans[i] = 1;  // 完全平方数直接是1
        } else {
            int min = i;  // 最大值为i个1相加
            // 修正2：遍历所有可能的完全平方数
            for (int j = 1; j <= sqrt_i; j++) {
                int square = j * j;
                if (ans[i - square] + 1 < min) {
                    min = ans[i - square] + 1;
                }
            }
            ans[i] = min;
        }
    }
    return ans[n];
}
