// 来源：endlesscheng《三种方法：排序 / 差分数组 / 扫描线（Python/Java/C++/Go/JS/Rust）》
// https://leetcode.cn/problems/merge-intervals/solutions/jian-dan-zuo-fa-yi-ji-wei-shi-yao-yao-zh-f2b3/
// 小节：方法二：差分数组
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    vector<vector<int>> merge(vector<vector<int>>& intervals) {
        int mx = 0;
        for (auto& p : intervals) {
            mx = max(mx, p[1]);
        }

        vector<int> diff(mx * 2 + 2);
        for (auto& p : intervals) {
            // 把区间 [p[0]*2, p[1]*2] 增加 1
            diff[p[0] * 2]++;
            diff[p[1] * 2 + 1]--;
        }

        vector<vector<int>> ans;
        int sum_d = 0;
        int start = -1; // -1 表示尚未遇到合并后的区间左端点
        for (int i = 0; i < diff.size(); i++) {
            sum_d += diff[i]; // 计算 diff 的前缀和
            if (sum_d > 0) {
                if (start < 0) {
                    start = i; // 合并后的区间左端点
                }
            } else if (start >= 0) {
                // i-1 是合并后的区间右端点
                // 由于乘 2 操作，区间左右端点都是偶数，所以 i-1 是偶数，i 是奇数，(i-1)/2 == floor(i/2)
                ans.push_back({start / 2, i / 2});
                start = -1;
            }
        }
        // 注：最后一轮循环 sum_d == 0，我们不会漏掉最后一个区间
        return ans;
    }
};
