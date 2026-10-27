class Solution {
public:
    int myPow(int a, int cur) {
        int res=a%1337;//注意及时取余
        int result=1;
        while (cur) {//最后操作会变成0
            if (cur==0) return 1;
            if (cur&1) result=(result*res)%1337;
            res=(res*res)%1337;
            cur>>=1;//推到下一个数
        }
        return result;
    }
    int superPow(int a, vector<int>& b) {
        if (b.empty()) return 1;
        int cur=b.back();
        b.pop_back();
        int p=myPow(a,cur);
        int q=myPow(superPow(a,b),10);//递归
        return (p%1337)*(q%1337)%1337;
    }
};
