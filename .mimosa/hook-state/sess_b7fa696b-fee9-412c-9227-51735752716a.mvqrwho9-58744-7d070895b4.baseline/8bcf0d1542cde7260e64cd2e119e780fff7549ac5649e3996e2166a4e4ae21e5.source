// 在乱序区间段的排列中找到紧邻的下一个区间的下标 
class Solution {
public:
    vector<int> findRightInterval(vector<vector<int>>& intervals) {
        int len=intervals.size();
        vector<int> ans(len,-1);
        vector<pair<int,int>> record(len); // 记录下标和左端点 
        for (int i=0;i<len;i++) record[i].first=i,record[i].second=intervals[i][0];
        sort(record.begin(),record.end(),[](const auto& a, const auto& b) {return a.second < b.second;});
        for (int i=0;i<len;i++) { // 用右端点为目标值进行二分查找 
            int aim=intervals[i][1];
            int left=0,right=len-1;
            while (left<right) {
                int mid=left+(right-left)/2;
                if (record[mid].second<aim) left=mid+1;
                else right=mid;
            }
            if (record[left].second>=aim) ans[i]=record[left].first;
        }
        return ans;
    }
};
