// 来源：endlesscheng《排序之后 BFS（Python/Java/C++/Go）》
// https://leetcode.cn/problems/multi-source-flood-fill/solutions/pai-xu-zhi-hou-bfspythonjavacgo-by-endle-4mp0/
// 小节：（无小节标题）
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
    static constexpr int DIRS[4][2] = {{0, -1}, {0, 1}, {-1, 0}, {1, 0}}; // 左右上下

public:
    vector<vector<int>> colorGrid(int n, int m, vector<vector<int>>& sources) {
        ranges::sort(sources, {}, [](auto& a) { return -a[2]; });

        vector ans(n, vector<int>(m));
        queue<pair<int, int>> q;
        for (auto& p : sources) {
            ans[p[0]][p[1]] = p[2]; // 初始颜色
            q.emplace(p[0], p[1]);
        }

        while (!q.empty()) {
            auto [i, j] = q.front();
            q.pop();
            for (auto [dx, dy] : DIRS) { // 向四个方向扩散
                int x = i + dx, y = j + dy;
                if (0 <= x && x < n && 0 <= y && y < m && ans[x][y] == 0) { // (x, y) 未着色
                    ans[x][y] = ans[i][j]; // 着色
                    q.emplace(x, y); // 继续扩散
                }
            }
        }

        return ans;
    }
};
