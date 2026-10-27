// 来源：endlesscheng《利用位运算优化（Python/Java/C++/C/Go/JS/Rust）》
// https://leetcode.cn/problems/ugly-number/solutions/li-yong-wei-yun-suan-you-hua-pythonjavac-nlqr/
// 小节：（无小节标题）
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    bool isUgly(int n) {
        if (n <= 0) {
            return false;
        }
        while (n % 3 == 0) {
            n /= 3;
        }
        while (n % 5 == 0) {
            n /= 5;
        }
        return (n & (n - 1)) == 0;
    }
};
