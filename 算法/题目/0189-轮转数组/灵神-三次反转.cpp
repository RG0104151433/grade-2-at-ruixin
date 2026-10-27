// 来源：endlesscheng《【图解】负负得正，一图秒懂！（Python/Java/C++/C/Go/JS/Rust）》
// https://leetcode.cn/problems/rotate-array/solutions/tu-jie-yuan-di-zuo-fa-yi-tu-miao-dong-py-ryfv/
// 小节：（该文只有一个 C++ 实现）
// 说明：外部题解，非本人实现；抓取于 2026-10-27，从档案正文抽出入库。

class Solution {
public:
    void rotate(vector<int>& nums, int k) {
        k %= nums.size(); // 轮转 k 次等同于轮转 k % n 次
        ranges::reverse(nums);
        reverse(nums.begin(), nums.begin() + k);
        reverse(nums.begin() + k, nums.end());
    }
};
