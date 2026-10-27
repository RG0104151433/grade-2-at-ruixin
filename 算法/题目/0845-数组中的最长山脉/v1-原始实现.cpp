class Solution {
public: 
    int longestMountain(vector<int>& arr) {
        int n=arr.size(),ans=0;
        for (int i=1;i<n-1;) {//注意这种不必定+1.而是视情况+1的类型
            //找到可能的峰顶：严格大于左右
            if (arr[i]>arr[i-1] && arr[i]>arr[i+1]) {
                int left=i-1,right=i+1;
                while (left>0 && arr[left]>arr[left-1]) left--;
                while (right<n-1 && arr[right]>arr[right+1]) right++;
                ans=max(ans,right-left+1);
                i=right;//跳过已处理部分（优化）
            }
            else i++;
        }
        return ans;
    }
};
