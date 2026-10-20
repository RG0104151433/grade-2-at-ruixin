class Solution {
public:
    int numberOfSpecialChars(string word) {
        int mask[2]{};
        for (char c:word) mask[c>>5&1]|=1<<(c&31);
        return popcount(1u*(mask[0]&mask[1]));
    }
};
