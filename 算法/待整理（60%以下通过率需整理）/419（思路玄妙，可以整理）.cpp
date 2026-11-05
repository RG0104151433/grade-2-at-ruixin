class Solution {
public:
    int countBattleships(vector<vector<char>>& board) {
        // 这题的关键在于其不可能是拐弯的，只能是一条直线
        int ans=0;
        for (int i=0;i<board.size();i++) {
            for (int j=0;j<board[i].size();j++) {
                if (board[i][j]=='X' && (i==0 || board[i-1][j]!='X') && (j==0 || board[i][j-1]!='X')) ans++;
            }
        }
        return ans;
    }
};
