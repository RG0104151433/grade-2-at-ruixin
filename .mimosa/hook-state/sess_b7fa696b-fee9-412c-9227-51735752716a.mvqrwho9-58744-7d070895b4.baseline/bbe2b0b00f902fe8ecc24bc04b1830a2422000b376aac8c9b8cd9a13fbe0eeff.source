class Solution {
public:
    vector<int> deckRevealedIncreasing(vector<int>& deck) {
        deque<int> dq;
        sort(deck.begin(),deck.end(),greater());
        int len=deck.size();
        for (int i=0;i<len;i++) {
            if (i==0) dq.push_back(deck[i]);
            else {
                int temp=dq.back();
                dq.pop_back();
                dq.push_front(temp);
                dq.push_front(deck[i]);
            }
        }
        vector<int> ans;
        for (int i:dq) ans.push_back(i);
        return ans;
    }
};
