//从头开始，每个位置可以向右跳nums[i]个位置，判断能否跳到最右边
class Solution {
public:
    bool canJump(vector<int>& nums) {
        int k=0,len=nums.size();
        for (int i=0;i<len;i++) {
            if (i>k) return false;
            k=max(k,i+nums[i]);//用k记录能够到达的最右端位置，到不了就false，到了就更新
        }
        return true;
    }
};
