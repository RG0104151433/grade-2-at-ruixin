class Solution {
public:
    int bitSquareSum(int n) {
        int sum=0;
        while (n>0) {
            int cur=n%10;
            sum+=cur*cur;
            n/=10;
        }
        return sum;
    }
    bool isHappy(int n) {
        int slow=n,fast=n;
        do {
            slow=bitSquareSum(slow);
            fast=bitSquareSum(fast);
            fast=bitSquareSum(fast);
        } while (slow!=fast);
        return slow==1;
    }
};
