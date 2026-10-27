class Solution {
public:
    void moveZeroes(vector<int>& nums) {
        int p=0;
        for (int& n:nums) {
            if (n) {
                swap(n,nums[p]);
                p++;
            }
        }
    }
};
//一个用来考虑每一个数字
//p用来表示非零数字个数
