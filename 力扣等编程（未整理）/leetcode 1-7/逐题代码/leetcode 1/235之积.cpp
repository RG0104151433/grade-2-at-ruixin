bool isUgly(int n) {
    if (n <= 0) {
        return false;
    }
    while (n % 3 == 0) {
        n /= 3;
    }
    while (n % 5 == 0) {
        n /= 5;
    }
    return (n & (n - 1)) == 0;
}
bool isUgly(int n) {
    if (n==1 || n==2 || n==3 || n==5) return true;
    else if (n<1 || (n%2!=0 && n%3!=0 && n%5!=0)) return false;
    else if (n%2==0) return isUgly(n/2);
    else if (n%3==0) return isUgly(n/3);
    else return isUgly(n/5);
}
