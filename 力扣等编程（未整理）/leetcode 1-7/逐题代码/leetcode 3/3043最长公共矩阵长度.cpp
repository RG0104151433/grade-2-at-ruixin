class Solution {
public:
    int longestCommonPrefix(vector<int>& arr1, vector<int>& arr2) {
        unordered_set<int> hash;
        int max=0;
        for (int i:arr1) {
            for (;i>0;i/=10) hash.insert(i);
        }
        for (int i:arr2) {
            while (!hash.contains(i) && i>0) i/=10;
            max=max>i?max:i;
        }
        return max?to_string(max).length():0;//此处为将int转换为string的方法
    }
};
