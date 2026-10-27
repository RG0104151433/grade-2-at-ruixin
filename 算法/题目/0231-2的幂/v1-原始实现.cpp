// 说明：本文件由 `v1-原始实现.cpp` 拆出（该文件里写了 2 份实现），这是第 1 份。

bool isPowerOfTwo(int n) {
    if (n == 1) return true;
    else if (n % 2 == 1 || n <= 0) return false;
    else return isPowerOfTwo(n>>1);
}
