class Solution {
public:
    int findLongestChain(vector<vector<int>>& pairs) {
        ranges::sort(pairs,{},[](auto& a) {return a[1];});
        int ans=0;
        int pre=INT_MIN;
        for (auto& p:pairs) {
            if (p[0]>pre) {
                ans++;
                pre=p[1];
            }
        }
        return ans;
    }
};//按照右端点排序，任何右端点更靠左的理论上都应该更优先（贪心）
