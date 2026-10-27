// 来源：endlesscheng《【模板】二分查找（Python/Java/C++/Go）》
// https://leetcode.cn/problems/find-smallest-letter-greater-than-target/solutions/mo-ban-er-fen-cha-zhao-pythonjavacgo-by-29zwb/
// 小节：库函数写法
// 说明：外部题解，非本人实现；抓取于 2026-10-27

class Solution {
public:
    char nextGreatestLetter(vector<char>& letters, char target) {
        auto it = ranges::upper_bound(letters, target);
        return it < letters.end() ? *it : letters[0];
    }
};
