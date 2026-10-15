class Solution {
public:
    int sumCounts(vector<int>& nums) {
        int len=nums.size();
        
        // 此处hash实际上就是个差分数组，可以通过“做差”得到两个位置之间的情况
        vector<vector<int>> hash(len+1,vector<int> (101,0)); // 注意差分需要多一个
        for (int i=0;i<len;i++) {
            int cur=nums[i]; // 记录当前位置
            hash[i+1][cur]++;
            for (int j=0;j<101;j++) hash[i+1][j]+=hash[i][j]; // 继承之前的
        }
        long long ans=0;
        for (int i=0;i<=len;i++) {
            for (int j=i+1;j<=len;j++) { // n^2的复杂度，还好不算太大
                int dif=0;
                for (int n=0;n<101;n++) {
                    if (hash[j][n]-hash[i][n]!=0) dif++;
                }
                ans+=(long long)dif*dif;
            }
        }
        return (int)ans;
    }
};