// 给你一个整数数组 nums 和一个整数 k。你的任务是将 nums 分割成一个或多个 非空 的连续子段，使得每个子段的 最大值 与 最小值 之间的差值 不超过 k。
// 返回在此条件下将 nums 分割的总方法数。
// 由于答案可能非常大，返回结果需要对 109 + 7 取余数。
class Solution {
public:
    int countPartitions(vector<int>& nums, int k) {
        const int mod=1000000007;
        int len=nums.size();
        deque<int> mn,mx; // 用于记录范围内的极值
        vector<int> ans(len+1); // 用于记录截止该位置的方法数
        ans[0]=1;
        long long cur=0; // 需要将仅限于left之前的数量减去
        int left=0;
        for (int i=0;i<len;i++) {
            int n=nums[i];
            // 开始处理当前位置
            cur=(cur+ans[i])%mod;
            while (!mn.empty() && n<=nums[mn.back()]) mn.pop_back();
            mn.push_back(i);
            while (!mx.empty() && n>=nums[mx.back()]) mx.pop_back();
            mx.push_back(i);
            // 将极值全部规范到left以内
            while (nums[mx.front()]-nums[mn.front()]>k) {
                cur=(cur-ans[left++]+mod)%mod;
                if (mn.front()<left) mn.pop_front();
                if (mx.front()<left) mx.pop_front();
            }
            ans[i+1]=cur%mod;
        }
        return ans[len];
    }
};

