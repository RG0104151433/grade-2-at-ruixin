//给定 n 个非负整数，用来表示柱状图中各个柱子的高度。每个柱子彼此相邻，且宽度为 1 。求在该柱状图中，能够勾勒出来的矩形的最大面积。
class Solution {
public:
    int largestRectangleArea(vector<int>& heights) {
        vector<int> left(heights.size(),-1);
        vector<int> right(heights.size(),heights.size());
        stack<int> stk;
        int ans=0;
        for (int i=0;i<heights.size();i++) {
            while (!stk.empty() && heights[stk.top()]>=heights[i]) {
                right[stk.top()]=i;
                stk.pop();
            }
            if (!stk.empty()) left[i]=stk.top();
            stk.push(i);
        }
        for (int i=0;i<heights.size();i++) ans=max(ans,heights[i]*(right[i]-left[i]-1));
        return ans;
    }
};
