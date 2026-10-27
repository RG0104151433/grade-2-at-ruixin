// 来源：endlesscheng《【图解】两种方法：动态规划/单调栈（Python/Java/C++/C/Go/JS/Rust）》
// https://leetcode.cn/problems/maximal-square/solutions/he-85-ti-yi-yang-de-zuo-fa-pythonjavaccg-az54/
// 小节：空间优化
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    int maximalSquare(vector<vector<char>>& matrix) {
        int n = matrix[0].size();
        vector<int> f(n + 1);
        int ans = 0;
        for (auto& row : matrix) {
            int pre = 0; // f[i][0] = 0
            for (int j = 0; j < n; j++) {
                if (row[j] == '1') {
                    int tmp = f[j + 1];
                    f[j + 1] = min({pre, f[j + 1], f[j]}) + 1; // 此时 pre = f[i][j]
                    pre = tmp; // 此时 pre = f[i][j+1]
                    ans = max(ans, f[j + 1]);
                } else {
                    f[j + 1] = 0;
                    pre = 0;
                }
            }
        }
        return ans * ans;
    }
};
