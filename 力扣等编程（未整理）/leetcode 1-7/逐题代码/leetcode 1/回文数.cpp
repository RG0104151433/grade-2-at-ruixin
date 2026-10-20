bool isPalindrome(int x) {
    if (x<0 || (x>0 && x%10==0)) return false;
    else {
        long int t=0,r=x;
        while (r/10!=0) {
            t=t*10+r%10;
            r=r/10;
        }
        t=t*10+r;
        if (t==x) return true;
        else return false;
    }
}
