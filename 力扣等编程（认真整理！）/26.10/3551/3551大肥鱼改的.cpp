class Solution {
public:
    int minSwaps(vector<int>& nums) {
        int n = nums.size();

        // {数位和, 数值, 原下标}
        vector<array<int,3>> a(n);
        for (int i = 0; i < n; ++i) {
            int x = nums[i], s = 0;
            while (x > 0) {
                s += x % 10;
                x /= 10;
            }
            a[i] = {s, nums[i], i};
        }

        sort(a.begin(), a.end());

        // to[原下标] = 目标位置
        vector<int> to(n);
        for (int i = 0; i < n; ++i) {
            to[a[i][2]] = i;
        }

        vector<char> visited(n, 0); // 比 vector<bool> 访问更快
        int circle = 0;

        for (int i = 0; i < n; ++i) {
            if (visited[i]) continue;
            ++circle;

            int j = i;
            while (!visited[j]) {
                visited[j] = 1;
                j = to[j];
            }
        }

        return n - circle;
    }
};
