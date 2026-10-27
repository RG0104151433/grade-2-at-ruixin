// 说明：本文件由 `v1-原始实现.cpp` 拆出（该文件里写了 2 份实现），这是第 1 份。

int addDigits(int num) {
    int sum=0;
    if (num<10) return num;
    else {
        while (num/10!=0) {
            sum+=num%10;
            num/=10;
        }
        return addDigits(sum+num);
    }
}
