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
int addDigits(int num) {
    return (num - 1) % 9 + 1;
}
