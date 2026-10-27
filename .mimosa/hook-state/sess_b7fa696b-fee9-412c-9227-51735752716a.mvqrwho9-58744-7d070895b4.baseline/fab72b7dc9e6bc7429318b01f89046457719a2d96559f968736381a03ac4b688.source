// 说明：原文件里写了多份实现（含错解/正解对照），其中至少一份编译不过。
// 按整理原则「不改写旧代码」，保留原件于此，档案状态标为待重做。

int xor_n(int n) {
    switch (n % 4) {
        case 0: return n;
        case 1: return 1;
        case 2: return n + 1;
        default: return 0;
    }
}
int xorOperation(int n, int start) {
    int a = start / 2;
    int b = n & start & 1; // 都为奇数才是 1
    return (xor_n(a + n - 1) ^ xor_n(a - 1)) * 2 + b;
}

int xorOperation(int n, int start) {
    int ans=0,i;
    for (i=0;i<n;i++) {
        ans ^= start+2*i;
    }
    return ans;
}
