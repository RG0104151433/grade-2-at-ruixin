class Solution {
public:
    int findTheWinner(int n, int k) {
        int x=0;
        for (int i=2;i<=n;i++) x=(k+x)%i;
        return x+1;
    }
};
