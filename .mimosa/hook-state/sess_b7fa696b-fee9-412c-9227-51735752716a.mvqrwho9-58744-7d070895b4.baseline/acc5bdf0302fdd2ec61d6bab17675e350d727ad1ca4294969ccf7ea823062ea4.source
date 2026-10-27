// 说明：本文件由 `v1-快慢双指针.cpp` 拆出（该文件里写了 2 份实现），这是第 2 份。

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
