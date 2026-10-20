//正确解法：图遍历（链表思路）
class Solution {
public:
    int findDuplicate(vector<int>& nums) {
        int n=nums.size();
        int s=0,f=0;
        do {
            s=(s+1)%n;
            f=(f+2)%n;
        } while (nums[s]!=nums[f]);
        return nums[s];
    }
};
//错误解法（线性遍历）
class Solution {
public:
    int findDuplicate(vector<int>& nums) {
        int n=nums.size();
        int s=0,f=0;
        do {
            s=(s+1)%n;
            f=(f+2)%n;
        } while (nums[s]!=nums[f]);
        return nums[s];
    }
};
