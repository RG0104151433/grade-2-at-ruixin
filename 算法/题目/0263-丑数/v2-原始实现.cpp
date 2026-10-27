// 说明：本文件由 `v1-原始实现.cpp` 拆出（该文件里写了 2 份实现），这是第 2 份。

bool isUgly(int n) {
    if (n==1 || n==2 || n==3 || n==5) return true;
    else if (n<1 || (n%2!=0 && n%3!=0 && n%5!=0)) return false;
    else if (n%2==0) return isUgly(n/2);
    else if (n%3==0) return isUgly(n/3);
    else return isUgly(n/5);
}
