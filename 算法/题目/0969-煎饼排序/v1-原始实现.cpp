class Solution {
public:
    vector<int> pancakeSort(vector<int>& arr) {
        vector<int> ans;
        for (int i=arr.size();i>0;i--) {
            int p;
            for (int j=0;j<arr.size();j++) {
                if (arr[j]==i) p=j;
            }
            if (p!=i && p!=0) {//注意条件，如果位置没问题就不用挪了
                reverse(arr.begin(),arr.begin()+p+1);//注意p和i是不一样的起点
                ans.emplace_back(p+1);//所以必须按照位置放，不能按照程序类型放
            }
            reverse(arr.begin(),arr.begin()+i);
            ans.emplace_back(i);
        }
        return ans;
    }
};
//关键思路是从大到小一个一个掰回去
