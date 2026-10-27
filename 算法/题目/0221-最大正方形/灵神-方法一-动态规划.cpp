// 来源：endlesscheng《【图解】两种方法：动态规划/单调栈（Python/Java/C++/C/Go/JS/Rust）》
// https://leetcode.cn/problems/maximal-square/solutions/he-85-ti-yi-yang-de-zuo-fa-pythonjavaccg-az54/
// 小节：方法一：动态规划
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    int maximalSquare(vector<vector<char>>& matrix) {
        int m = matrix.size(), n = matrix[0].size();
        vector f(m + 1, vector<int>(n + 1));
        int ans = 0;
        for (int i = 0; i < m; i++) {
            for (int j = 0; j < n; j++) {
                if (matrix[i][j] == '1') {
                    f[i + 1][j + 1] = min({f[i][j], f[i][j + 1], f[i + 1][j]}) + 1;
                    ans = max(ans, f[i + 1][j + 1]);
                }
            }
        }
        return ans * ans;
    }
};
