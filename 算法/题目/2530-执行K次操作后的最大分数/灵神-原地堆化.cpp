// 来源：灵茶山艾府（@endlesscheng）——原合集里的注释写着「原地堆化 O(1)空间，来自灵神」。
// 说明：外部题解，非本人实现；从 `1046-最后一块石头的重量/附录-原合集.cpp` 拆出（整理于 2026-10-27）。

class Solution {
public:
    long long maxKelements(vector<int> &nums, int k) {
        make_heap(nums.begin(), nums.end()); // 原地堆化（最大堆）
        long long ans = 0;
        while (k--) {
            pop_heap(nums.begin(), nums.end()); // 把堆顶移到末尾
            ans += nums.back();
            nums.back() = (nums.back() + 2) / 3;
            push_heap(nums.begin(), nums.end()); // 把末尾元素入堆
        }
        return ans;
    }
};//原地堆化 O(1)空间，来自灵神
