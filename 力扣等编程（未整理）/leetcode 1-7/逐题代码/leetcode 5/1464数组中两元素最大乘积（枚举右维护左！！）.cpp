class Solution {
public:
    int maxProduct(vector<int>& nums) {
        int ans=0,mx=0;
        for (int x:nums) {
            ans=max(ans,(x-1)*(mx-1));
            mx=max(mx,x);
        }
        return ans;
    }
};
