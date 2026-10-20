class Solution {
public:
    bool isPerfectSquare(int num) {
        int n = num, left = 1, right = 0;
        while (n > 0) {
            right = right * 10 + 9;
            n /= 100;
        }
        while (left < right) {
            int mid = left + (right - left) / 2;
            long long sq = (long long)mid * mid;   // 安全计算平方
            if (sq == (long long)num) return true;
            else if (sq > (long long)num) right = mid - 1;
            else left = mid + 1;
        }
        long long sq = (long long)left * left;      // 安全计算平方
        return sq == (long long)num;
    }
};
