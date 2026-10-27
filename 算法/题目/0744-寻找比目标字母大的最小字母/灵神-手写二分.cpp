// 来源：endlesscheng《【模板】二分查找（Python/Java/C++/Go）》
// https://leetcode.cn/problems/find-smallest-letter-greater-than-target/solutions/mo-ban-er-fen-cha-zhao-pythonjavacgo-by-29zwb/
// 小节：手写二分
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    char nextGreatestLetter(vector<char>& letters, char target) {
        int n = letters.size();
        int left = -1, right = n;
        while (left + 1 < right) {
            int mid = left + (right - left) / 2;
            (letters[mid] > target ? right : left) = mid;
        }
        return right < n ? letters[right] : letters[0];
    }
};
