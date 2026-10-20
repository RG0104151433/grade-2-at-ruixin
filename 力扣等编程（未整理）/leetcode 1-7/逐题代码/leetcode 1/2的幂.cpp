bool isPowerOfTwo(int n) {
    if (n == 1) return true;
    else if (n % 2 == 1 || n <= 0) return false;
    else return isPowerOfTwo(n>>1);
}
bool isPowerOfTwo(int n) {
    return n > 0 && (n & (n - 1)) == 0;
}
