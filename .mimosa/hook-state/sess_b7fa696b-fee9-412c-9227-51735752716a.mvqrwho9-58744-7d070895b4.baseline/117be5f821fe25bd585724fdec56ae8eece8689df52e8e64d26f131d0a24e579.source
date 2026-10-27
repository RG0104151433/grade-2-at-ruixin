class Solution {
public:
    int hIndex(vector<int>& citations) {
        sort(citations.begin(),citations.end());
        int len=citations.size();
        int left=0,right=citations.size();
        while (left<right) {
            int mid=left+(right-left)/2;
            if (len-mid<=citations[mid]) right=mid;
            else left=mid+1;
        }
        return len-left;
    }
};