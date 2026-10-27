// 说明：本文件由 `v1-快慢双指针.cpp` 拆出（该文件里写了 2 份实现），这是第 1 份。

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
